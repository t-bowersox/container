export type Constructor<T = unknown> = { new (...args: unknown[]): T };
export type ServiceRegistry = WeakMap<Constructor, unknown[]>;

export class Container {
  private registry: ServiceRegistry;
  private instances: WeakMap<Constructor, unknown>;

  constructor() {
    this.registry = new WeakMap();
    this.instances = new WeakMap();
  }

  add<T extends Constructor>(newClass: T, ...args: unknown[]): Container {
    this.registry.set(newClass, args);
    return this;
  }

  addStatic<T extends Constructor>(
    className: T,
    ...args: unknown[]
  ): Container {
    const instance = new className(...args);
    this.instances.set(className, instance);
    return this;
  }

  appendArgs(className: Constructor, ...newArgs: unknown[]): void {
    const args = this.registry.get(className) ?? [];
    args.push(...newArgs);
    this.registry.set(className, args);
  }

  replaceArgs(className: Constructor, ...args: unknown[]): void {
    this.registry.set(className, args);
  }

  get<T>(className: Constructor<T>): T {
    // Check for an existing static instance and return it
    const existing = this.instances.get(className) as T;
    if (existing) {
      return existing;
    }

    // Otherwise, build a brand new instance
    const args = this.registry.get(className) ?? [];
    const preparedArgs = args.map((arg) => {
      if (typeof arg != "function") {
        return arg;
      }

      try {
        // A class is a constructor function, so test for it
        const maybeConstructor = arg as Constructor;
        const registered = this.get(maybeConstructor);
        // If the class is unregistered, then call its constructor with no args
        return registered ? registered : new maybeConstructor();
      } catch (error) {
        // If function is not a constructor, then return it as a callback
        return arg;
      }
    });

    return new className(...preparedArgs);
  }

  delete(className: Constructor): void {
    this.registry.delete(className);
  }
}

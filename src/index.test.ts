import { Container } from "./index";
import { ContainerError } from "./index";

class NoArgs {}

class PrimitiveArgs {
  constructor(public str: string, public num: number) {}
}

class ClassArgs {
  constructor(public primitiveArgs: PrimitiveArgs, public noArgs: NoArgs) {}
}

class CallbackArg {
  constructor(public callback: { (): boolean }) {}
}

describe("#Container", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  test("can chain multipe #add and/or #addStatic calls", () => {
    container.add(NoArgs).addStatic(PrimitiveArgs, "foo", 42);
    expect(container.has(NoArgs)).toBe(true);
    expect(container.hasStatic(PrimitiveArgs)).toBe(true);
  });

  describe("#add", () => {
    test("adds a class to the registry", () => {
      container.add(PrimitiveArgs, "foo", 42);
      expect(container.has(PrimitiveArgs)).toBe(true);
    });

    test("handles classes with no arguments", () => {
      container.add(NoArgs);
      expect(container.has(NoArgs)).toBe(true);
    });
  });

  describe("#addStatic", () => {
    test("adds a static instance", () => {
      container.addStatic(PrimitiveArgs, "foo", 42);
      expect(container.hasStatic(PrimitiveArgs)).toBe(true);
    });

    test("handles classes with no arguments", () => {
      container.addStatic(NoArgs);
      expect(container.hasStatic(NoArgs)).toBe(true);
    });

    test("handles classes with missing arguments", () => {
      container.addStatic(PrimitiveArgs);
      expect(container.hasStatic(PrimitiveArgs)).toBe(true);
    });
  });

  describe("#appendArgs", () => {
    test("appends arguments to a registered class", () => {
      container.add(PrimitiveArgs, "foo");
      container.appendArgs(PrimitiveArgs, 42);
      const instance = container.get(PrimitiveArgs);
      expect(instance.str).toBe("foo");
      expect(instance.num).toBe(42);
    });

    test("appends arguments to a registered class with no current arguments", () => {
      container.add(PrimitiveArgs);
      container.appendArgs(PrimitiveArgs, "foo");
      const instance = container.get(PrimitiveArgs);
      expect(instance.str).toBe("foo");
    });

    test("throws an error if the class is unregistered", () => {
      const appendToUnregistered = () => {
        return container.appendArgs(PrimitiveArgs);
      };
      expect(appendToUnregistered).toThrow(ContainerError);
    });
  });

  describe("#get", () => {
    test("gets a static instance from the registry if present", () => {
      container
        .addStatic(PrimitiveArgs, "foo", 42)
        .add(PrimitiveArgs, "bar", 24);
      let instance = container.get(PrimitiveArgs);
      expect(instance.str).toBe("foo");
      expect(instance.num).toBe(42);

      instance.str = "hello world";
      instance = container.get(PrimitiveArgs);
      expect(instance.str).toBe("hello world");
    });

    test("creates a new class instance from the registry", () => {
      container.add(PrimitiveArgs, "foo", 42);
      const instanceA = container.get(PrimitiveArgs);
      expect(instanceA.str).toBe("foo");
      expect(instanceA.num).toBe(42);
      instanceA.str = "hello world";

      const instanceB = container.get(PrimitiveArgs);
      expect(instanceB.str).toBe("foo"); // should not be "hello world"
      expect(instanceB.num).toBe(42);
    });

    test("recursively injects registered dependencies", () => {
      container
        .add(NoArgs)
        .add(PrimitiveArgs, "foo", 42)
        .add(ClassArgs, PrimitiveArgs, NoArgs);

      const instance = container.get(ClassArgs);
      expect(instance.noArgs).toBeTruthy();
      expect(instance.primitiveArgs.str).toBe("foo");
      expect(instance.primitiveArgs.num).toBe(42);
    });

    test("handles classes with no arguments", () => {
      container.add(NoArgs);
      const instance = container.get(NoArgs);
      expect(instance instanceof NoArgs).toBe(true);
    });

    test("throws error if referencing unregistered classes", () => {
      container.add(ClassArgs, PrimitiveArgs, NoArgs);
      const getUnregisteredArgs = () => {
        return container.get(ClassArgs);
      };
      expect(getUnregisteredArgs).toThrow(ContainerError);

      const getUnregisteredClass = () => {
        return container.get(NoArgs);
      };
      expect(getUnregisteredClass).toThrow(ContainerError);
    });

    test("returns non-constructor functions as callback arguments", () => {
      const callback = () => true;
      container.add(CallbackArg, callback);
      const instance = container.get(CallbackArg);
      expect(instance.callback()).toBe(true);
    });
  });

  describe("#delete", () => {
    test("deletes a class from the registry", () => {
      container.add(NoArgs);
      container.delete(NoArgs);
      expect(container.has(NoArgs)).toBe(false);
    });

    test("throws error if referencing an unregistered class", () => {
      const deleteUnregistered = () => {
        return container.delete(NoArgs);
      };
      expect(deleteUnregistered).toThrow(ContainerError);
    });
  });

  describe("#deleteStatic", () => {
    test("deletes a static instance", () => {
      container.addStatic(NoArgs);
      container.deleteStatic(NoArgs);
      expect(container.hasStatic(NoArgs)).toBe(false);
    });

    test("throws error if referencing an unregistered class", () => {
      const deleteUnregistered = () => {
        return container.deleteStatic(NoArgs);
      };
      expect(deleteUnregistered).toThrow(ContainerError);
    });
  });

  describe("#has", () => {
    test("returns true if a container has a class", () => {
      container.add(NoArgs);
      expect(container.has(NoArgs)).toBe(true);
    });

    test("returns false if a container does not have a class", () => {
      expect(container.has(NoArgs)).toBe(false);
    });
  });

  describe("#hasStatic", () => {
    test("returns true if a container has a static instance", () => {
      container.addStatic(NoArgs);
      expect(container.hasStatic(NoArgs)).toBe(true);
    });
    test("returns false if a container does not have a static instance", () => {
      expect(container.hasStatic(NoArgs)).toBe(false);
    });
  });
});

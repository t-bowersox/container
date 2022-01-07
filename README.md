# Container

A dependency injection container built with TypeScript, with a simple API and (ironcially) zero dependencies.

## Usage

### Create a new container

```typescript
import { Container } from "@t-bowersox/container";

const container = new Container();
```

### Add a class or static instance

You can add either a class or a static instance of a class to your container.

- Use `add()` to add a class. With this method, a new instance of that class will be returned each time the class is retrieved.
- Use `addStatic()` to add a static instance of a class. With this method, the same instance will be returned each time the class is retrieved.

The first argument to both methods is the class you want to add. Provide the class itself, not a string. For example, to add the `Date` class, you'd use `container.add(Date)`.

The remaining arguments are the arguments to pass to that class's constructor. Make sure to add these in the same order in which they're defined in your class constructor's signature.

- Primitive values and objects will be passed to the constructor as-is.
- Functions that are not constructors will be passed as callbacks.
- If a class dependends on an instance of another class, provide it as an argument and an instance of it will be injected into the class. Be sure to also add the dependency's class to the container, as well.

```typescript
class UserService {
  constructor(private repo: UserRepository) {}
}

class UserRepository {
  constructor(private database: DatabaseService) {}
}

class DatabaseService {
  constructor(host: string, port: number) {/*...*/}
}

container
  .addStatic(DatabaseService, "localhost", 1234 })
  .add(UserRepository, DatabaseService)
  .add(UserService, UserRepository);
```

For example, imagine you have a class called `DatabaseService`, which handles interactions with your database. That class is a dependency of `UserRepository`, which sends it query data.

If you add `DatabaseService` as a static instance, it will not only be injected into the `UserRepository` class, but you can also retrieve that instance from the container.

This could, for example, allow you to call the database's `connect()` and `disconnect()` methods before you start calling the repository to add users, etc.

### Append arguments to an added class

Use the `appendArgs()` method to add arguments to a class that has already been added to your container.

```typescript
class TokenService {
  constructor(private privKey: string, private pubKey: string) {}
}

container.add(TokenService, "private-key-here");
container.appendArgs(TokenService, "public-key-here");
```

### Get a class instance from the container

Use the `get()` method to retrieve a class instance from your container.

- For classes added using `add()`, you will get a new instance with each call.
- For classes added using `addStatic()`, you will get the same, singleton instance with each call.

```typescript
const container = new Container();

container
  .addStatic(DatabaseService, "localhost", 1234 })
  .add(UserRepository, DatabaseService)
  .add(UserService, UserRepository);

const userService = container.get(UserService);
const database = container.get(DatabaseService);

await database.connect();

/* Works because this is the same static instance of database injected into the userService's repo */
const user = await userService.getUser(12345);
```

If you are retrieving a class that has dependencies, the container will first check if a static instance has been added. If not, it will then check to see if the class itself has been added.

If the class exists, then the container will create a new instance of it using the arguments you provided when calling `add()` or `appendArgs()`.

This process is recursive, so if that dependency has other dependencies in your container, those will also be injected.

If the class has not been added to the container, the container will throw a `ContainerError`.

### Delete a class or static instance

To remove a class from the container, use `delete()`. To remove a static instance from the container, use `deleteStatic()` instead.

```typescript
container.delete(TokenService);
container.deleteStatic(DatabaseService);
```

### Check if a container has a class or static instance

If you need to check if a class has been added to a container, you can use the `has()` method. Similarly, you can check if a static instance has been added by using `hasStatic()`. These return a boolean result.

```typescript
container
  .addStatic(DatabaseService, "localhost", 1234 })
  .add(UserRepository, DatabaseService)
  .add(UserService, UserRepository);

container.has(UserService); // true
container.has(DatabaseService); // false
container.hasStatic(DatabaseService); // true
```

## API

### Class: `Container`

#### Method: `add`

Adds a class and its constructor arguments to the container. Each time `get()` is called, a new instance of the class will be returned.

```typescript
add<T extends Constructor>(newClass: T, ...args: any[]): Container;
```

**Parameters**

- `newClass`: The class to add to the container.
- `args`: The arguments to pass to the class's constructor. Can be a primitive or another class. If a class is used, the container will create an instance of it and pass it to the constructor.

**Returns**

The container object returns itself, allowing chaining multiple calls to `add()` and/or `addStatic()`.

#### Method: `addStatic`

Adds a static instance of a class to the container. Instead of creating a new instance each time `get()` is called, that single instance will be returned instead.

```typescript
addStatic<T extends Constructor>(className: T, ...args: any[]): Container;
```

**Parameters**

- `className`: The class to add to the container.
- `args`: The arguments to pass to the class's constructor. Can be a primitive or another class. If a class is used, the container will create an instance of it and pass it to the constructor.

**Returns**

The container object returns itself, allowing chaining multiple calls to `add()` and/or `addStatic()`.

#### Method: `appendArgs`

Appends arguments to a class's existing arguments array.

```typescript
appendArgs(className: Constructor, ...newArgs: any[]): void;
```

**Parameters**

- `className`: The class to modify.
- `newArgs`: The new arguments to append to the existing arguments array.

**Throws**

- `ContainerError` if `className` has not been added to the container.

#### Method: `get`

Reurns an instance of a class from the container. If the class was registered using `addStatic()`, a singleton instance will be returned with each call to `get()`.

If a class depends on another class added to the container, it will build an instance of it using the stored arguments and inject it as a dependency. If a class was registered using `addStatic()`, the container will inject a singleton instance of that class.

```typescript
get<T>(className: Constructor<T>): T;
```

**Parameters**

- `className`: The class to retrieve.

**Returns**

An instance of the provided `className`.

**Throws**

- `ContainerError` if `className` has not been added to the container.

#### Method: `delete`

Removes a class (registered using `add()`) from the container.

```typescript
delete(className: Constructor): void;
```

**Parameters**

- `className`: The class to remove.

**Throws**

- `ContainerError` if `className` has not been added to the container.

#### Method: `deleteStatic`

Removes a static instance from the container.

```typescript
deleteStatic(className: Constructor): void;
```

**Parameters**

- `className`: The class to remove.

**Throws**

- `ContainerError` if `className` has not been added to the container.

#### Method: `has`

Checks for the presence of a class in the registry.

```typescript
has(className: Constructor): boolean;
```

**Parameters**

- `className`: The class to look for.

**Returns**

- `true` if the class has been added to the container.
- `false` if the class has not been added to the container.

#### Method: `hasStatic`

Checks for the presence of a static instance in the container.

```typescript
hasStatic(className: Constructor): boolean;
```

- `className`: The class to look for.

**Returns**

- `true` if the container has a static instance of that class.
- `false` if the container does not have a static instance of that class.

## Contributing

This is primarily a package that I intend to reuse in my own projects. I've decided to open source it in case there are other folks who might also find it useful.

With that in mind, I only expect to make changes to Container that jibe with how I intend to use it myself.

But if you do have ideas or found bugs, please do file an issue and I'll gladly review it. 🙂

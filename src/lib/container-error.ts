export class ContainerError extends Error {
  name = "ContainerError";

  constructor(public message: string) {
    super();
  }
}

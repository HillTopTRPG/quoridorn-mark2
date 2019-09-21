export class ApplicationError implements Error {
  public name = "ApplicationError";

  constructor(public message: string) {}

  public toString() {
    return `${this.name}: ${this.message}`;
  }
}

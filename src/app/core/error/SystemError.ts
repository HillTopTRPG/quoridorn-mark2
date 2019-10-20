export class SystemError implements Error {
  public name = "SystemError";

  constructor(public message: string) {}

  public toString() {
    return `${this.name}: ${this.message}`;
  }
}

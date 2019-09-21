export class NoSuchMethodError implements Error {
  public readonly name: string;
  public readonly message: string;

  constructor(public className: string, public methodName: string) {
    this.name = Object.getPrototypeOf(this).name;
    this.message = [
      `${this.name}:`,
      `Class=${this.className},`,
      `Method=${this.methodName}`
    ].join(" ");
  }

  public toString() {
    return this.message;
  }
}

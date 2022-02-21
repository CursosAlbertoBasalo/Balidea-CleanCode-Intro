export class CreditCardDTO {
  constructor(public readonly number: string, public readonly expiration: string, public readonly cvv: string) {}
}

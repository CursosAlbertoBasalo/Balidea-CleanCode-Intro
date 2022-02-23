import { CreditCardVO } from "./creditCardVO";
import { PayMeDTO } from "./payMeDTO";
import { PaymentMethod } from "./payments";

export class BookingPaymentDTO {
  constructor(
    public readonly method: PaymentMethod,
    public readonly creditCard?: CreditCardVO,
    public readonly payMe?: PayMeDTO,
    public readonly transferAccount?: string,
  ) {}
}

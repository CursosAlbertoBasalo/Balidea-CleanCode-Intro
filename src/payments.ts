/* eslint-disable max-lines-per-function */
import { Booking } from "./booking";
import { CreditCardDTO } from "./creditCardDTO";
import { HTTP } from "./http";
import { Notifications } from "./notifications";

export enum PaymentMethod {
  CREDIT_CARD,
  PAY_ME,
  TRANSFER,
}

export class Payments {
  private cardWayAPIUrl = "https://card-way.com/";
  private payMeAPIUrl = "https://pay-me.com/v1/payments";
  private bankEmail = "humanprocessor@bancka.com";
  private booking!: Booking;
  // To Do: 🚧 clean pending...
  public payBooking(
    booking: Booking,
    method: PaymentMethod,
    cardNumber: string,
    cardExpiry: string,
    cardCVC: string,
    payMeAccount: string,
    payMeCode: string,
    transferAccount: string,
  ): string {
    this.booking = booking;
    switch (method) {
      case PaymentMethod.CREDIT_CARD: {
        const creditCard = new CreditCardDTO(cardNumber, cardExpiry, cardCVC);
        return this.payWithCard(creditCard);
      }
      case PaymentMethod.PAY_ME:
        return this.payWithPayMe(payMeAccount, payMeCode);
      case PaymentMethod.TRANSFER:
        return this.payWithBank(transferAccount);
      default:
        throw new Error(`Unknown payment method: ${method}`);
    }
  }
  private payWithCard(creditCard: CreditCardDTO) {
    const url = `${this.cardWayAPIUrl}payments/card${creditCard.number}/${creditCard.expiration}/${creditCard.cvv}`;
    const response = HTTP.request(url, {
      method: "POST",
      body: { amount: this.booking.price, concept: this.booking.id },
    });
    if (response.status === 200) {
      return response.body ? (response.body.transactionID as string) : "";
    } else {
      return "";
    }
  }
  private payWithPayMe(payMeAccount: string, payMeCode: string) {
    const url = `${this.payMeAPIUrl}`;
    const response = HTTP.request(url, {
      method: "POST",
      body: { payMeAccount, payMeCode, amount: this.booking.price, identification: this.booking.id },
    });
    if (response.status === 201) {
      return response.body ? (response.body.pay_me_code as string) : "";
    } else {
      return "";
    }
  }
  private payWithBank(transferAccount: string) {
    if (this.booking.id === null || this.booking.id === undefined) {
      throw new Error("Booking id is null or undefined");
    }
    const notifications = new Notifications();
    return notifications.notifyBankTransfer(this.bankEmail, this.booking.id, this.booking.price, transferAccount);
  }
}

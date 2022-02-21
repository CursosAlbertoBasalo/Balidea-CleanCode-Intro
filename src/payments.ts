/* eslint-disable max-lines-per-function */
import { Booking } from "./booking";
import { BookingPaymentDTO } from "./bookingPaymentDTO";
import { CreditCardVO } from "./creditCardVO";
import { HTTP } from "./http";
import { Notifications } from "./notifications";
import { PayMeDTO } from "./payMeDTO";

export enum PaymentMethod {
  CREDIT_CARD,
  PAY_ME,
  TRANSFER,
}

export class Payments {
  private cardWayAPIUrl = "https://card-way.com/";
  private payMeAPIUrl = "https://pay-me.com/v1/payments";
  private bankEmail = "humanprocessor@bancka.com";

  constructor(private booking: Booking) {}

  public payBooking(bookingPayment: BookingPaymentDTO): string {
    switch (bookingPayment.method) {
      case PaymentMethod.CREDIT_CARD:
        return this.payWithCard(bookingPayment.creditCard);
      case PaymentMethod.PAY_ME:
        return this.payWithPayMe(bookingPayment.payMe);
      case PaymentMethod.TRANSFER:
        return this.payWithBank(bookingPayment.transferAccount);
      default:
        throw new Error(`Unknown payment method: ${bookingPayment.method}`);
    }
  }
  private payWithCard(creditCard?: CreditCardVO) {
    if (!creditCard) {
      throw new Error("Credit card is null or undefined");
    }
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
  private payWithPayMe(payMe?: PayMeDTO) {
    if (!payMe) {
      throw new Error("PayMe is null or undefined");
    }
    const url = `${this.payMeAPIUrl}`;
    const response = HTTP.request(url, {
      method: "POST",
      body: {
        payMeAccount: payMe.account,
        payMeCode: payMe.code,
        amount: this.booking.price,
        identification: this.booking.id,
      },
    });
    if (response.status === 201) {
      return response.body ? (response.body.pay_me_code as string) : "";
    } else {
      return "";
    }
  }
  private payWithBank(transferAccount?: string) {
    if (!transferAccount) {
      throw new Error("Transfer account is null or undefined");
    }
    if (this.booking.id === null || this.booking.id === undefined) {
      throw new Error("Booking id is null or undefined");
    }
    const notifications = new Notifications();
    return notifications.notifyBankTransfer({
      recipient: this.bankEmail,
      bookingId: this.booking.id,
      amount: this.booking.price,
      transferAccount: transferAccount,
    });
  }
}

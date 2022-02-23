import { Booking, BookingStatus } from "./booking";
import { BookingsLogic } from "./bookings.logic";
import { BookingsRepository } from "./bookings.repository";
import { BookingsRequestDTO } from "./bookingsRequestDTO";
import { BookingsRequestVO } from "./bookingsRequestVO";
import { CreditCardVO } from "./creditCardVO";
import { DateRangeVO } from "./dateRangeVO";
import { DB } from "./db";
import { Notifications } from "./notifications";
import { PaymentMethod, Payments } from "./payments";
import { SMTP } from "./smtp";
import { Traveler } from "./traveler";
import { Trip } from "./trip";

export class Bookings {
  private booking!: Booking;
  private trip!: Trip;
  private traveler!: Traveler;
  private bookingsRequest!: BookingsRequestVO;
  private bookingsLogic!: BookingsLogic;
  private bookingsRepository = new BookingsRepository();
  /**
   * Requests a new booking
   * @param bookingsRequestDTO - the booking request
   * @returns {Booking} the new booking object
   * @throws {Error} if the booking is not possible
   */
  public request(bookingsRequestDTO: BookingsRequestDTO): Booking {
    this.bookingsRequest = new BookingsRequestVO(bookingsRequestDTO);
    this.bookingsLogic = new BookingsLogic(this.bookingsRequest);
    this.trip = this.bookingsRepository.selectTripById(this.bookingsRequest.tripId);
    this.traveler = this.bookingsRepository.selectTravelerById(this.bookingsRequest.travelerId);
    this.create();
    this.booking = this.bookingsRepository.insert(this.booking);
    this.pay();
    this.notify();
    return this.booking;
  }

  private create(): void {
    this.bookingsRequest.passengersCount = this.bookingsLogic.getValidatedPassengersCount(this.traveler);
    this.bookingsLogic.checkAvailability(this.trip);
    this.booking = new Booking(
      this.bookingsRequest.tripId,
      this.bookingsRequest.travelerId,
      this.bookingsRequest.passengersCount,
    );
    this.booking.hasPremiumFoods = this.bookingsRequest.hasPremiumFoods;
    this.booking.extraLuggageKilos = this.bookingsRequest.extraLuggageKilos;
  }

  public notify() {
    if (this.booking.id === undefined) {
      return;
    }
    const notifications = new Notifications();
    return notifications.notifyBookingConfirmation({
      recipient: this.traveler.email,
      tripDestination: this.trip.destination,
      bookingId: this.booking.id,
    });
  }

  private pay() {
    try {
      this.payWithCreditCard(this.bookingsRequest.card);
    } catch (error) {
      this.booking.status = BookingStatus.ERROR;
      DB.update(this.booking);
      throw error;
    }
  }

  private payWithCreditCard(creditCard: CreditCardVO) {
    this.booking.price = this.calculatePrice();
    const paymentId = this.payPriceWithCard(creditCard);
    if (paymentId != "") {
      this.setPaymentStatus();
    } else {
      this.processNonPayedBooking(creditCard.number);
    }
    DB.update(this.booking);
  }

  private payPriceWithCard(creditCard: CreditCardVO) {
    const payments = new Payments(this.booking);
    const paymentId = payments.payBooking({
      method: PaymentMethod.CREDIT_CARD,
      creditCard,
      payMe: undefined,
      transferAccount: "",
    });
    return paymentId;
  }

  private processNonPayedBooking(cardNumber: string) {
    this.booking.status = BookingStatus.ERROR;
    const smtp = new SMTP();
    smtp.sendMail({
      from: "payments@astrobookings.com",
      to: this.traveler.email,
      subject: "Payment error",
      body: `Using card ${cardNumber} amounting to ${this.booking.price}`,
    });
  }

  private setPaymentStatus() {
    this.booking.paymentId = "payment fake identification";
    this.booking.status = BookingStatus.PAID;
  }

  private calculatePrice(): number {
    const stayingNights = new DateRangeVO(this.trip.startDate, this.trip.endDate).toWholeDays;
    const passengerPrice = this.calculatePassengerPrice(stayingNights);
    const passengersPrice = passengerPrice * this.booking.passengersCount;
    const extraTripPrice = this.calculateExtraPricePerTrip();
    return passengersPrice + extraTripPrice;
  }

  private calculateExtraPricePerTrip() {
    return this.booking.extraLuggageKilos * this.trip.extraLuggagePricePerKilo;
  }

  private calculatePassengerPrice(stayingNights: number) {
    const stayingPrice = stayingNights * this.trip.stayingNightPrice;
    const premiumFoodsPrice = this.booking.hasPremiumFoods ? this.trip.premiumFoodPrice : 0;
    const flightPrice = this.trip.flightPrice + premiumFoodsPrice;
    const passengerPrice = flightPrice + stayingPrice;
    return passengerPrice;
  }
}

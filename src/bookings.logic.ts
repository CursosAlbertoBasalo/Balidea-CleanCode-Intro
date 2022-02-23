import { BookingsRequestVO } from "./bookingsRequestVO";
import { Traveler } from "./traveler";
import { Trip } from "./trip";

export class BookingsLogic {
  private traveler!: Traveler;

  constructor(private bookingsRequest: BookingsRequestVO) {}

  public getValidatedPassengersCount(traveler: Traveler) {
    this.traveler = traveler;
    this.assertPassengers();

    return this.bookingsRequest.passengersCount;
  }
  public checkAvailability(trip: Trip) {
    const hasAvailableSeats = trip.availablePlaces >= this.bookingsRequest.passengersCount;
    if (!hasAvailableSeats) {
      throw new Error("There are no seats available in the trip");
    }
  }

  private assertPassengers() {
    this.assertPassengersForVip();
    this.assertPassengersForNonVip();
  }

  private assertPassengersForVip() {
    const maxPassengersCount = 6;
    if (this.bookingsRequest.passengersCount > maxPassengersCount) {
      throw new Error(`Nobody can't have more than ${maxPassengersCount} passengers`);
    }
  }
  private assertPassengersForNonVip() {
    const maxNonVipPassengersCount = 4;
    const isTooMuchForNonVip = this.bookingsRequest.passengersCount > maxNonVipPassengersCount;
    if (!this.traveler.isVip && isTooMuchForNonVip) {
      throw new Error(`Nobody can't have more than ${maxNonVipPassengersCount} passengers`);
    }
  }
}

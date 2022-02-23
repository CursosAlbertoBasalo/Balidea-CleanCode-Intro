import { Booking, BookingStatus } from "./booking";
import { DB } from "./db";
import { Notifications } from "./notifications";
import { SMTP } from "./smtp";
import { Traveler } from "./traveler";
import { Trip, TripStatus } from "./trip";

export class Trips {
  private tripId = "";
  private trip!: Trip;
  public cancelTrip(tripId: string) {
    this.tripId = tripId;
    this.trip = this.updateTripStatus();
    this.cancelBookings();
  }

  // ! To Do: take infrastructure to a trips repository

  private updateTripStatus() {
    const trip: Trip = DB.selectOne<Trip>(`SELECT * FROM trips WHERE id = '${this.tripId}'`);
    trip.status = TripStatus.CANCELLED;
    DB.update(trip);
    return trip;
  }

  private cancelBookings() {
    const bookings: Booking[] = DB.select("SELECT * FROM bookings WHERE trip_id = " + this.tripId);
    if (this.hasNoBookings(bookings)) {
      return;
    }
    const smtp = new SMTP();
    for (const booking of bookings) {
      this.cancelBooking(booking, smtp, this.trip);
    }
  }

  private hasNoBookings(bookings: Booking[]) {
    return !bookings || bookings.length === 0;
  }

  private cancelBooking(booking: Booking, smtp: SMTP, trip: Trip) {
    this.updateBookingStatus(booking);
    this.notifyTraveler(booking, smtp, trip);
  }

  private notifyTraveler(booking: Booking, smtp: SMTP, trip: Trip) {
    const traveler = DB.selectOne<Traveler>(`SELECT * FROM travelers WHERE id = '${booking.travelerId}'`);
    if (!traveler) {
      return;
    }
    // 🧼 Inject smtp into the Notifications class
    const notifications = new Notifications(new SMTP());
    notifications.notifyTripCancellation({
      recipient: traveler.email,
      tripDestination: trip.destination,
      bookingId: booking.id,
    });
  }

  private updateBookingStatus(booking: Booking) {
    booking.status = BookingStatus.CANCELLED;
    DB.update(booking);
  }
}

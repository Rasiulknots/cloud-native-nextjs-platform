import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    // References Event._id — validated in the pre-save hook
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "eventId is required"],
      index: true, // faster lookups by event
    },

    // Basic email format enforced at the schema level
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Invalid email address",
      },
    },
  },
  { timestamps: true }
);

// ── Pre-save hook ─────────────────────────────────────────────────────────────
BookingSchema.pre<IBooking>("save", async function (next) {
  // Guard: only run the DB lookup when eventId is new or has changed
  if (!this.isModified("eventId")) return next();

  const eventExists = await mongoose
    .model("Event")
    .exists({ _id: this.eventId });

  if (!eventExists) {
    return next(
      new Error(`Referenced event not found: ${this.eventId.toString()}`)
    );
  }

  next();
});

const Booking: Model<IBooking> =
  mongoose.models.Booking ??
  mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;

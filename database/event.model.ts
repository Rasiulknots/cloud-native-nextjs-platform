import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: "online" | "offline" | "hybrid";
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },

    // Unique URL-friendly identifier — generated in the pre-save hook
    slug: { type: String, unique: true, index: true },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, "Overview is required"],
      trim: true,
    },
    image: { type: String, required: [true, "Image is required"] },
    venue: { type: String, required: [true, "Venue is required"], trim: true },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },

    // Stored as ISO 8601 date string after normalization in the pre-save hook
    date: { type: String, required: [true, "Date is required"] },

    // Stored in HH:MM (24-hour) format after normalization
    time: { type: String, required: [true, "Time is required"] },

    mode: {
      type: String,
      required: [true, "Mode is required"],
      enum: {
        values: ["online", "offline", "hybrid"],
        message: "Mode must be online, offline, or hybrid",
      },
    },
    audience: {
      type: String,
      required: [true, "Audience is required"],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, "Agenda is required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "Agenda must have at least one item",
      },
    },
    organizer: {
      type: String,
      required: [true, "Organizer is required"],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, "Tags are required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "Tags must have at least one entry",
      },
    },
  },
  { timestamps: true }
);

// ── Pre-save hook ─────────────────────────────────────────────────────────────
EventSchema.pre<IEvent>("save", function (next) {
  // Regenerate slug only when title changes to avoid breaking existing URLs
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")   // strip non-alphanumeric chars
      .replace(/\s+/g, "-")            // spaces → hyphens
      .replace(/-+/g, "-");            // collapse consecutive hyphens
  }

  // Normalize date to ISO 8601 (YYYY-MM-DD) — rejects unparseable values
  if (this.isModified("date")) {
    const parsed = new Date(this.date);
    if (isNaN(parsed.getTime())) {
      return next(new Error(`Invalid date value: "${this.date}"`));
    }
    this.date = parsed.toISOString().split("T")[0];
  }

  // Normalize time to HH:MM 24-hour format using a simple regex guard
  if (this.isModified("time")) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(this.time)) {
      return next(
        new Error(
          `Invalid time format: "${this.time}". Expected HH:MM (24-hour).`
        )
      );
    }
  }

  next();
});

const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>("Event", EventSchema);

export default Event;

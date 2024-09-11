import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import { Event, IEvent } from "../models/eventModel";

export const getEventsController = asyncErrorHandler(async (req, res, next) => {
  const events = await Event.find().sort();

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Events fetched successfully",
    data: events,
  });
});

export const createEventController = asyncErrorHandler(
  async (req, res, next) => {
    const { title, allDay, start, end, description, society } = req.body;

    const requiredFields = ["title", "allDay", "start"];

    const missingFields = requiredFields.filter(
      (field) => req.body[field] == undefined || req.body[field] === null,
    );

    if (missingFields.length > 0) {
      const error = new CustomError(
        `Please enter ${missingFields.join(", ")}`,
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }

    // if event_allDay is true and end time is true was passed
    if (allDay && end) {
      const error = new CustomError(
        "Cannot provide end time to all day event",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }

    const newEvent = new Event({
      title,
      allDay,
      start,
      end: allDay ? null : end,
      description: description || null,
      society: society || null,
    });

    await newEvent.save();

    console.log("Event created");

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Event created successfully",
      data: newEvent,
    });
  },
);

export const createEventsController = asyncErrorHandler(
  async (req, res, next) => {
    const {events} = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      const error = new CustomError(
        "No events provided. Please provide an array of events.",
        StatusCode.BAD_REQUEST
      );
      return next(error);
    }

    const createdEvents: IEvent[] = [];
    const errors: {event: IEvent, error: string}[] = [];

    for (const event of events) {
      const {title, allDay, start, end, description, society} = event;

      const requiredFields = ["title", "allDay", "start"];
      const missingFields = requiredFields.filter(
        (field) => event[field] == undefined || event[field] == null
      );

      if (missingFields.length > 0) {
        errors.push({
            event: event,
            error: `Missing fields: ${missingFields.join(', ')}`,
        });
        continue;
      }

      // if event_allDay is true and end time is true was passed
      if (allDay && end) {
        errors.push({
          event: event,
          error: "Cannot provide end time to all day events",
        });
        continue;
      }

      const newEvent = new Event({
        title,
        allDay,
        start,
        end: allDay ? null : end,
        description: description || null,
        society: society || null,
      });

      try {
        const savedEvent = await newEvent.save();
        createdEvents.push(savedEvent);
      } catch (err) {
        errors.push({
          event: event,
          error: err.message,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(StatusCode.PARTIAL_CONTENT).json({
        status: "partial success",
        message: "Some events were not created successfully",
        createdEvents,
        errors,
      });
    }

    res.status(StatusCode.OK).json({
      status: "success",
      message: "All events created successfully",
      createdEvents,
    });
  }
);


export const updateEventController = asyncErrorHandler(
  async (req, res, next) => {
    const id = req.params.id;
    const {
      event_title,
      event_allDay,
      event_start,
      event_end,
      event_description,
      event_society,
    } = req.body;

    if (!id) {
      const error = new CustomError(
        "Please provide event id",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }

    // if event_allDay is true and end time is true was passed
    if (event_allDay && event_end) {
      const error = new CustomError(
        "Cannot provide end time to all day event",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }

    const updateData: Partial<IEvent> = {};
    if (event_title !== undefined) {
      updateData.title = event_title;
    }

    //if allday is true, then ensure end time is null
    if (event_allDay !== undefined) {
      updateData.allDay = event_allDay;
      if (event_allDay === true) {
        updateData.end = null;
      }
    }

    // if start in request and allDay is undefined, user may be changing the date of the event or allDay was prev false and user is changing start time
    // in either case, not required to update allDay
    if (event_start !== undefined) {
      updateData.start = event_start;
    }

    //assuming if end in request and allDay is undefined, then allDay is false
    if (event_end !== undefined) {
      updateData.end = event_end;
      updateData.allDay = false;
    }

    if (event_description !== undefined)
      updateData.description = event_description;

    if (event_society !== undefined) updateData.society = event_society;

    const event = await Event.updateOne({ _id: id }, updateData);

    if (!event) {
      const error = new CustomError("Event not found", StatusCode.NOT_FOUND);
      return next(error);
    }

    console.log("Event updated", req.body, event);

    return res.status(StatusCode.OK).json({
      status: "success",
      message: "Event updated successfully",
      event,
    });
  },
);

export const deleteEventController = asyncErrorHandler(
  async (req, res, next) => {
    const id = req.params.id;

    if (id) {
      const event = await Event.findByIdAndDelete(id);

      if (!event) {
        const error = new CustomError("Event not found", StatusCode.NOT_FOUND);
        return next(error);
      }

      console.log("Event deleted", req.body, event);

      return res.status(StatusCode.OK).json({
        status: "success",
        message: "Event deleted successfully",
      });
    } else {
      const error = new CustomError(
        "Please provide event_id to delete an event.",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }
  },
);

import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import { Event, IEvent } from "../models/eventModel";

export const getEventsController = asyncErrorHandler(async (req, res, next) => {
  const events = await Event.find().sort();

  if (!events || events.length === 0) {
    const error = new CustomError("No events found", StatusCode.NOT_FOUND);
    return next(error);
  }

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Events fetched successfully",
    data: events,
  });
});

export const createEventsController = asyncErrorHandler(
  async (req, res, next) => {
    const { title, allDay, start, end, description } = req.body;

    const requiredFields = ["title", "allDay"];

    const missingFields = requiredFields.filter(
      (field) => req.body[field] == undefined || req.body[field] === null,
    );

    // is event is not allDay, we dont need start or end times
    if (allDay === false && !req.body["start"]) {
      missingFields.push("start");
    }

    if (missingFields.length > 0) {
      const error = new CustomError(
        `Please enter ${missingFields}`,
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }

    const newEvent = new Event({
      title,
      allDay,
      start: allDay ? null : start,
      end: allDay ? null : end,
      description: description || null,
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

export const updateEventController = asyncErrorHandler(
  async (req, res, next) => {
    const {
      event_id,
      event_title,
      event_allDay,
      event_start,
      event_end,
      event_description,
    } = req.body;

    if (!event_id) {
      const error = new CustomError(
        "Please provide event_id",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }

    if (event_allDay && (event_start || event_end)) {
      const error = new CustomError(
        "Cannot provide start and end times to all day event",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    } else if (!event_allDay && !event_start) {
      const error = new CustomError(
        "Cannot make event allDay if no start time provided",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }

    const updateData: any = {};
    if (event_title !== undefined) updateData.title = event_title;
    if (event_allDay !== undefined) updateData.allDay = event_allDay;
    if (event_allDay === false && event_start !== undefined)
      updateData.start = event_start;
    if (event_allDay === false && event_end !== undefined)
      updateData.end = event_end;
    if (event_description !== undefined)
      updateData.description = event_description;

    const event = await Event.updateOne({ _id: event_id }, updateData);

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

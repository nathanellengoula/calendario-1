const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const Event = require("./models").event;
const ics = require("ics");
const schedule = require("node-schedule");
const notifier = require("node-notifier");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/api/events", async (req, res) => {
  const { title, date, time, duration, location, email, recurring, frequency, repeatCount } = req.body;

  try {
    const event = await Event.create({
      title,
      date,
      time,
      duration,
      location,
      email,
      recurring,
      frequency,
      repeatCount,
    });

    // Schedule the notification when the event time arrives
    scheduleEventNotification(event);

    // Send email notification
    sendEmailNotification(email, event);
    
    res.status(201).send({ message: "Event created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error creating event" });
  }
});

const sendEmailNotification = (email, event) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, // or 465 for SSL
    secure: false, // true for 465, false for other ports
    auth: {
      user: "biloofranckbranly@gmail.com",
      pass: "branly-86",
    },
  });

  const mailOptions = {
    from: "biloofranckbranly@gmail.com",
    to: email,
    subject: "Event Reminder",
    text: `You have an upcoming event: ${event.title} on ${event.date} at ${event.time}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(error);
    }
    console.log("Email sent: " + info.response);
  });
};

// Function to schedule the event notification
const scheduleEventNotification = (event) => {
  let { title, date, time } = event;

  // Check if `date` is a Date object, and convert to string if necessary
  if (typeof date !== "string") {
    date = date.toISOString().split("T")[0]; // Converts date to YYYY-MM-DD format
  }

  const [year, month, day] = date.split("-");
  const [hour, minute] = time.split(":");

  // Schedule time in the future using node-schedule
  const eventTime = new Date(year, month - 1, day, hour, minute); // month is zero-indexed

  schedule.scheduleJob(eventTime, () => {
    // Trigger OS notification when the event time arrives
    notifier.notify({
      title: "Event Reminder",
      message: `Your event '${title}' is starting now!`,
      sound: true, // Set to true for sound notification (if available)
      wait: true,
    });

    console.log(`Notification sent for event: ${title} at ${eventTime}`);
  });
};


// Create the iCalendar (.ics) event
const createICalEvent = (event) => {
  const { title, date, time, duration, location } = event;
  const [year, month, day] = date.split("-");
  const [hour, minute] = time.split(":");

  const eventData = {
    start: [parseInt(year), parseInt(month), parseInt(day), parseInt(hour), parseInt(minute)],
    duration: { hours: duration },
    title: title,
    location: location,
  };

  ics.createEvent(eventData, (error, value) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log(value); // Save this value as .ics file or send as an attachment
  });
};

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

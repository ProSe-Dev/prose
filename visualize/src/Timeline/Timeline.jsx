import React from "react";
import TimelineItem from "./TimelineItem";

/**
 * Converts array of events in to object having date as the key and list of
 * event for that date as the value
 *
 * @param {Array} items Array of events in the form of ts and text
 * @returns {Object} return object with key as date and values array in events for that date
 */
function getFormattedData(items) {
  const activities = {};
  items.forEach(({ ts, text, highlighted, highlightedText }, index) => {
    const date = new Date(ts);
    // format of of MMM DD YYYY
    const dateStr = date.toDateString().substring(4);
    const list = activities[dateStr] || [];
    list.push({
      time: date.toTimeString().substring(0, 8),
      text,
      highlighted,
      highlightedText,
      key: index
    });
    activities[dateStr] = list;
  });
  return activities;
}

function Timeline({ items }) {
  const activities = getFormattedData(items);
  const dates = Object.keys(activities);
  return (
    <div className="time-line-ctnr">
      {dates.map(d => (
        <ul className="time-line" key={d}>
          <li className="time-label">
            <div className="fstart-wrapper">
              <span>{d}</span>
            </div>
          </li>
          {activities[d].map(
            ({ time, text, highlighted, highlightedText, key }) => (
              <TimelineItem
                time={time}
                text={text}
                highlighted={highlighted}
                highlightedText={highlightedText}
                key={key}
              />
            )
          )}
        </ul>
      ))}
    </div>
  );
}

export default Timeline;

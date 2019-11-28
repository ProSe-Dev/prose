import React from "react";

/**
 * @usage
 * <TimlineItem time={time} text={text} />
 */
function TimlineItem({ time, text }) {
  return (
    <li>
      <i className="fa" />
      <div className="time-line-item">
        <span className="time">
          <i className="fa fa-clock-o" />
          {time}
        </span>
        <div className="time-line-header">{text}</div>
      </div>
    </li>
  );
}

export default TimlineItem;

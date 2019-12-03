import React from "react";

/**
 * @usage
 * <TimlineItem time={time} text={text} />
 */
function TimlineItem({ time, text, highlighted, highlightedText }) {
  return (
    <li>
      <i className="fa" />
      <div
        className={`time-line-item ${highlighted ? "highlighted" : ""}`}
      >
        <span className="time">
          <i className="fa fa-clock-o" />
          {time}
        </span>
        <div className="time-line-header">
          {highlighted && (
            <div>
              <b>{highlightedText}</b>
            </div>
          )}
          {text}
        </div>
      </div>
    </li>
  );
}

export default TimlineItem;

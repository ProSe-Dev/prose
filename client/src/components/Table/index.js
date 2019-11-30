import React from "react";

function Table(props) {
  const { headers, rows } = props;
  const headerBGColor = props.headerBGColor ? props.headerBGColor : "#373A3C";
  const headerTextColor = props.headerTextColor
    ? props.headerTextColor
    : "#ECEEEF";
  return (
    <table className="table table-light">
      <thead
        style={{
          borderColor: headerBGColor,
          backgroundColor: headerBGColor,
          color: headerTextColor
        }}
      >
        <tr>
          {headers.map(h => (
            <th>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr>
            {r.map(rd => (
              <td>{rd}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;

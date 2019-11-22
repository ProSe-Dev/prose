import React from 'react';

function Table(props) {
  const {headers, rows} = props;
  return (
    <table className="table table-light">
      <thead className="thead-dark">
        <tr>
          {headers.map(h => <th>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr>
            {r.map(rd => <td>{rd}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default Table;
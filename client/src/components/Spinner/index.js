// source: https://loading.io/css/
import React from 'react';
import spinner from 'assets/icons/spinner.gif'

function Spinner(props) {
  let className = props.className ? props.className : '';
  let height = props.height ? props.height : '80px';
  let width = props.width ? props.width : '80px';

  return (
    <div>
      <img className={className} src={spinner} alt="loading..." height={height} width={width}/>
    </div>
  );
}

export default Spinner;

import React, {useMemo, useCallback} from 'react';
import {useDropzone} from 'react-dropzone';
const crypto = require('crypto');

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out',
  height: '100px',
  width: '500px',
};

const activeStyle = {
  borderColor: '#2196f3'
};

const acceptStyle = {
  borderColor: '#00e676'
};

const rejectStyle = {
  borderColor: '#ff1744'
};

function Dropzone(props) {
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
      // Do whatever you want with the file contents
        const binaryStr = reader.result
        console.log( props.selectedFile)
        var sha256 = crypto.createHash('sha256').update(binaryStr).digest("hex")
        props.parent.setState({ selectedFile: {binary: binaryStr, path: file.path, hash: sha256}})
        console.log( props.parent.state.selectedFile)
        console.log(binaryStr)
      }
      reader.readAsArrayBuffer(file)
    })
    
  }, [])

  const {
    acceptedFiles,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({onDrop});

  const style = useMemo(() => ({
    ...baseStyle,
    ...(isDragActive ? activeStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isDragActive,
    isDragReject
  ]);

  return (
    <div className="container">
      <div {...getRootProps({style})}>
        <input {...getInputProps()} />
        <p style={{wordWrap: "break-word"}}>{acceptedFiles.length > 0?
        acceptedFiles[acceptedFiles.length-1].path
        : "Drag and drop a file here or click"}</p>
      </div>
    </div>
  );
}

export default Dropzone;
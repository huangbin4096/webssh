import React from 'react';
import { useParams } from 'react-router-dom';
import { LabTerminal } from '../components/LabTerminal';
import DefaultLayout from './Layout';

export default () => {
  const { id } = useParams();

  return (
    <DefaultLayout>
      <>
        <h1>Terminal {id}</h1>
        <div className="h-100 w-100">
          <LabTerminal terminalId={id} />
        </div>
      </>
    </DefaultLayout>
  );
};

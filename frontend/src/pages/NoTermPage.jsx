import DefaultLayout from './Layout';

export default () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ssh`;
  return <DefaultLayout>NoTermPage</DefaultLayout>;
};

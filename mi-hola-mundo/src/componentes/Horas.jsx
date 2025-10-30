import dayjs from 'dayjs';

export const calcularHorasCumplidas = (entrada, salida) => {
  if (!entrada || !salida) return 0;
  const horaEntrada = dayjs(`2000-01-01T${entrada}`);
  const horaSalida = dayjs(`2000-01-01T${salida}`);
  return horaSalida.diff(horaEntrada, 'minute');
};

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';

const PUNCHLINES = [
  'Countdown to Launching Video. Let’s go!  🚀',
  'Less than 24 hours until launch. Keep Pushing!  💪',
  'Video has been launched! 🎉🚀 Keep Pushing!  💪',
];

const formatValue = (value: number) =>
  value < 10 ? `0${value}` : value.toString();

const divMod = (dividend: number, divisor: number) => [
  Math.floor(dividend / divisor),
  dividend % divisor,
];
const calculateTimeLeft = (deadline: number) => {
  const now = new Date().getTime();
  const totalSecondsLeft = Math.round((deadline - now) / 1000);

  if (totalSecondsLeft <= 0)
    return { totalSecondsLeft: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const [days, minusDaysLeft] = divMod(totalSecondsLeft, 24 * 3600);
  const [hours, minusHoursLeft] = divMod(minusDaysLeft, 3600);
  const [minutes, seconds] = divMod(minusHoursLeft, 60);

  return {
    totalSecondsLeft,
    days,
    hours,
    minutes,
    seconds,
  };
};

type CountdownProps = {
  deadlineTimestamp: number;
};

export const Countdown = ({ deadlineTimestamp }: CountdownProps) => {
  const [left, setLeft] = useState(calculateTimeLeft(deadlineTimestamp));

  useEffect(() => {
    const interval = setInterval(
      () => setLeft(calculateTimeLeft(deadlineTimestamp)),
      1000,
    );
    return () => {
      clearInterval(interval);
    };
  }, [deadlineTimestamp]);

  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10%',
        gap: '1.25rem',
      }}
    >
      <Box
        sx={{
          fontSize: '12px',
          lineHeight: '15px',
          letterSpacing: '0.2rem',
          color: '#fff',
          textTransform: 'uppercase',
        }}
      >
        {left.totalSecondsLeft <= 0
          ? PUNCHLINES[2]
          : left.days === 0
          ? PUNCHLINES[1]
          : PUNCHLINES[0]}
      </Box>
      <Stack
        direction="row"
        sx={{
          borderRadius: '8px',
          overflow: 'hidden',
          paddingInline: '0.25rem',
          background: left.days > 0 ? '#212326' : '#005FFF',
        }}
      >
        <CounterBox amount={left.days} unit="days" />
        <CounterBox amount={left.hours} unit="hours" />
        <CounterBox amount={left.minutes} unit="minutes" />
        <CounterBox amount={left.seconds} unit="seconds" />
      </Stack>
    </Stack>
  );
};

type CounterBoxProps = {
  amount: number;
  unit: 'days' | 'hours' | 'minutes' | 'seconds';
};

const CounterBox = ({ amount, unit }: CounterBoxProps) => (
  <Stack
    sx={{
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.5rem 0.75rem',
      fontWeight: '300',
      minWidth: '70px',
    }}
  >
    <Box
      sx={{
        fontSize: '32px',
        lineHeight: '39px',
        letterSpacing: '0.2rem',
        color: '#fff',
      }}
    >
      {formatValue(amount)}
    </Box>
    <Box
      sx={{
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
        lineHeight: '17px',
        textTransform: 'uppercase',
      }}
    >
      {unit}
    </Box>
  </Stack>
);

export const rpmToRadiansPerSecond = (rpm) => rpm * Math.PI * 2 / 60;

export function advancePingPong(
  state,
  speed,
  minimum,
  maximum,
  deltaSeconds,
) {
  if (maximum <= minimum) {
    return { position: minimum, direction: 1 };
  }

  const direction = state.direction < 0 ? -1 : 1;
  const distance = Math.max(0, speed) * Math.max(0, deltaSeconds);
  let position = Math.min(maximum, Math.max(minimum, state.position));
  let nextDirection = direction;

  if (distance === 0) {
    return { position, direction: nextDirection };
  }

  position += distance * nextDirection;

  while (position < minimum || position > maximum) {
    if (position > maximum) {
      position = maximum - (position - maximum);
      nextDirection = -1;
    } else if (position < minimum) {
      position = minimum + (minimum - position);
      nextDirection = 1;
    }
  }

  if (position === maximum) nextDirection = -1;
  if (position === minimum) nextDirection = 1;

  return { position, direction: nextDirection };
}

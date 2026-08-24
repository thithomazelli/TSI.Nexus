import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

export const cardCollapseAnimation = trigger('cardCollapse', [
  state(
    'open',
    style({
      height: '*',
      opacity: 1,
    }),
  ),
  state(
    'closed',
    style({
      height: '0px',
      opacity: 0,
    }),
  ),
  transition('open => closed', [animate('250ms ease-in')]),
  transition('closed => open', [animate('300ms ease-out')]),
]);

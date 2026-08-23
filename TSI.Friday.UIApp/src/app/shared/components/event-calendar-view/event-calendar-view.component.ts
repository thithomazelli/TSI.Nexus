import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AgendaEvent, TranslationService } from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

// Outlook-style month/week/day/list calendar, shared by the main Agenda screen and by every
// entity's own "Agenda" tab. Knows nothing about how events were fetched/filtered - it only
// renders whatever AgendaEvent[] it's given, colored by eventTypeColor, and reports back clicks
// (edit) and drag-selected ranges (create prefilled).
@Component({
    selector: 'app-event-calendar-view',
    templateUrl: './event-calendar-view.component.html',
    styleUrl: './event-calendar-view.component.scss',
    imports: [FullCalendarModule],
})
export class EventCalendarViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  events: AgendaEvent[] = [];

  @Output()
  eventClicked = new EventEmitter<AgendaEvent>();

  @Output()
  rangeSelected = new EventEmitter<{ start: Date; end: Date }>();

  @ViewChild('calendar')
  calendarComponent?: FullCalendarComponent;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    selectable: true,
    selectMirror: true,
    editable: false,
    height: 'auto',
    events: [],
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    select: (arg: DateSelectArg) => this.onRangeSelect(arg),
  };

  private _destroy$ = new Subject<void>();

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.applyLocale(this.translationService.current);
    this.translationService.language$
      .pipe(takeUntil(this._destroy$))
      .subscribe((language) => this.applyLocale(language));
    this.applyEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] && !changes['events'].firstChange) {
      this.applyEvents();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private applyLocale(language: string): void {
    this.calendarOptions = {
      ...this.calendarOptions,
      locale: language === 'pt-BR' ? ptBrLocale : language === 'es' ? esLocale : 'en',
    };
  }

  private applyEvents(): void {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: (this.events ?? []).map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        backgroundColor: event.eventTypeColor ?? undefined,
        borderColor: event.eventTypeColor ?? undefined,
        extendedProps: { original: event },
      })),
    };
  }

  private onEventClick(arg: EventClickArg): void {
    const original = arg.event.extendedProps['original'] as AgendaEvent;
    if (original) {
      this.eventClicked.emit(original);
    }
  }

  private onRangeSelect(arg: DateSelectArg): void {
    this.rangeSelected.emit({ start: arg.start, end: arg.end });
    this.calendarComponent?.getApi().unselect();
  }
}

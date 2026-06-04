import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { apiService, CalendarEvent } from '../services/api';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, X } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const AgendaPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeStr, setTimeStr] = useState('09:00');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedDate(slotInfo.start);
    setSelectedEvent(null);
    setTitle('');
    setDescription('');
    setTimeStr('09:00');
    setShowModal(true);
  };

  const handleSelectEvent = (event: any) => {
    const rawEvent = events.find(e => e.id === event.id);
    if (rawEvent) {
      setSelectedEvent(rawEvent);
      setTitle(rawEvent.title);
      setDescription(rawEvent.description || '');
      setSelectedDate(new Date(rawEvent.eventDate));
      const d = new Date(rawEvent.eventDate);
      setTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      setShowModal(true);
    }
  };

  const handleSave = async () => {
    if (!title || !selectedDate) return;

    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const eventDate = new Date(selectedDate);
      eventDate.setHours(hours, minutes, 0, 0);

      if (selectedEvent && selectedEvent.id) {
        const updated = {
          ...selectedEvent,
          title,
          description,
          eventDate: eventDate.toISOString()
        };
        await apiService.updateEvent(selectedEvent.id, updated);
      } else {
        const newEvent = {
          title,
          description,
          eventDate: eventDate.toISOString(),
          isCompleted: false
        };
        console.log("Sending event:", newEvent);
        await apiService.addEvent(newEvent);
      }
      setShowModal(false);
      loadEvents();
    } catch (error: any) {
      console.error("Error saving event", error);
      alert("Error saving event: " + (error.message || error.toString()));
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !selectedEvent.id) return;
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await apiService.deleteEvent(selectedEvent.id);
        setShowModal(false);
        loadEvents();
      } catch (error) {
        console.error("Error deleting event", error);
      }
    }
  };

  const mappedEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    start: new Date(e.eventDate),
    end: new Date(new Date(e.eventDate).getTime() + 60 * 60 * 1000), // default 1 hour length
  }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-widest flex items-center gap-3">
          <CalendarIcon className="text-emerald-400" />
          Smart Agenda
        </h1>
        <button 
          onClick={() => { setSelectedDate(new Date()); setSelectedEvent(null); setTitle(''); setDescription(''); setShowModal(true); }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold tracking-widest uppercase text-xs transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className="glass-panel flex-1 rounded-3xl border border-white/5 overflow-hidden p-4 relative calendar-container flex flex-col min-h-[600px]">
        <style>{`
          .rbc-calendar { flex: 1; font-family: 'Inter', sans-serif; color: #cbd5e1; min-height: 550px; }
          .rbc-header { padding: 10px; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; background: rgba(15,23,42,0.4); flex: 1; }
          .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05); }
          .rbc-month-row { border-top: 1px solid rgba(255,255,255,0.05); }
          .rbc-off-range-bg { background: rgba(0,0,0,0.2); }
          .rbc-today { background: rgba(52, 211, 153, 0.05); }
          .rbc-event { background-color: rgba(52, 211, 153, 0.2); border: 1px solid rgba(52, 211, 153, 0.4); color: #34d399; border-radius: 6px; padding: 2px 5px; font-size: 11px; font-weight: 600; }
          .rbc-event.rbc-selected { background-color: rgba(52, 211, 153, 0.4); }
          .rbc-toolbar button { color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin: 0 4px; padding: 6px 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: transparent; transition: all 0.2s; }
          .rbc-toolbar button:hover, .rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background: rgba(52, 211, 153, 0.1); color: #34d399; border-color: rgba(52, 211, 153, 0.3); }
          .rbc-time-content { border-top: 1px solid rgba(255,255,255,0.05); }
          .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.05); }
          .rbc-time-header-content { border-left: 1px solid rgba(255,255,255,0.05); }
        `}</style>
        
        {isLoading ? (
           <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
             <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
           </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={mappedEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
            defaultView="month"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            popup
          />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Event Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Project Meeting"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Date</label>
                  <input 
                    type="date" 
                    value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                    onChange={e => setSelectedDate(new Date(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Time</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={timeStr}
                      onChange={e => setTimeStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <Clock size={14} className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Description (Optional)</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-950/50 flex items-center justify-between border-t border-white/5">
              {selectedEvent ? (
                <button 
                  onClick={handleDelete}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              ) : <div></div>}
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!title}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaPage;

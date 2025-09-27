import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface BookingData {
  name: string;
  email: string;
  date: string;
  time: string;
  duration: number;
  message: string;
}

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    name: '',
    email: '',
    date: '',
    time: '',
    duration: 60,
    message: ''
  });
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Get tomorrow's date as minimum selectable date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Get max date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const fetchAvailability = async (date: string, duration: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/calendar/availability?date=${date}&duration=${duration}`);
      const data = await response.json();
      
      if (response.ok) {
        // Parse the availability string to extract time slots
        const slots = data.availability.split('\n')
          .filter((line: string) => line.match(/^\d+\./))
          .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
        setAvailableSlots(slots);
      } else {
        console.error('Failed to fetch availability:', data.error);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailableSlots([]);
    }
    setLoading(false);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setBookingData(prev => ({ ...prev, date, time: '' }));
    if (date) {
      fetchAvailability(date, bookingData.duration);
    }
  };

  const handleDurationChange = (duration: string) => {
    const durationNum = parseInt(duration);
    setBookingData(prev => ({ ...prev, duration: durationNum, time: '' }));
    if (selectedDate) {
      fetchAvailability(selectedDate, durationNum);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus('loading');

    try {
      // Create the meeting using the chat completion endpoint
      // This will trigger the AI assistant to schedule the meeting
      const meetingRequest = `Please schedule a meeting with the following details:
- Name: ${bookingData.name}
- Email: ${bookingData.email}
- Date: ${bookingData.date}
- Time: ${bookingData.time.split(' - ')[0]}
- Duration: ${bookingData.duration} minutes
- Message: ${bookingData.message}

Title: "Meeting with ${bookingData.name}"
Description: "${bookingData.message}"`;

      const response = await fetch('/api/chat/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: meetingRequest }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setBookingStatus('success');
        setStatusMessage(`✅ Your meeting has been scheduled! You'll receive a calendar invitation at ${bookingData.email}`);
        // Reset form
        setBookingData({
          name: '',
          email: '',
          date: '',
          time: '',
          duration: 60,
          message: ''
        });
        setSelectedDate('');
        setAvailableSlots([]);
      } else {
        setBookingStatus('error');
        setStatusMessage('❌ Failed to schedule the meeting. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus('error');
      setStatusMessage('❌ An error occurred while scheduling your meeting. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <Calendar className="w-8 h-8" />
              Book a Call
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Schedule a meeting with me - I'll get back to you shortly!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            {bookingStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                {statusMessage}
              </div>
            )}
            
            {bookingStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {statusMessage}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Name *
                  </label>
                  <Input
                    required
                    value={bookingData.name}
                    onChange={(e) => setBookingData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    value={bookingData.email}
                    onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Meeting Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Meeting Duration
                </label>
                <Select value={bookingData.duration.toString()} onValueChange={handleDurationChange}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Preferred Date *
                </label>
                <Input
                  type="date"
                  required
                  min={minDate}
                  max={maxDateStr}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Available Time Slots *
                  </label>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading available times...</span>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <Select 
                      value={bookingData.time} 
                      onValueChange={(time) => setBookingData(prev => ({ ...prev, time }))}
                      required
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot, index) => (
                          <SelectItem key={index} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                      No available time slots for this date. Please select a different date.
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message (Optional)
                </label>
                <Textarea
                  value={bookingData.message}
                  onChange={(e) => setBookingData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell me what you'd like to discuss..."
                  className="border-gray-300 focus:border-blue-500 min-h-[100px]"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 text-lg"
                disabled={bookingStatus === 'loading' || !bookingData.name || !bookingData.email || !bookingData.date || !bookingData.time}
              >
                {bookingStatus === 'loading' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Meeting
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
              <p>
                🔒 Your information is secure and will only be used to schedule your meeting.
              </p>
              <p className="mt-2">
                📧 You'll receive a calendar invitation with meeting details via email.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

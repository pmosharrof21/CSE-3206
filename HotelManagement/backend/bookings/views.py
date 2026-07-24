from rest_framework import viewsets
from .models import Booking
from .serializers import BookingSerializer
class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    queryset = Booking.objects.select_related('room', 'room__hotel').all()

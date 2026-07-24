from rest_framework import viewsets
from .models import Hotel
from .serializers import HotelSerializer
class HotelViewSet(viewsets.ModelViewSet):
    serializer_class = HotelSerializer
    def get_queryset(self):
        queryset = Hotel.objects.all()
        city, search = self.request.query_params.get('city'), self.request.query_params.get('search')
        if city: queryset = queryset.filter(city__icontains=city)
        if search: queryset = queryset.filter(name__icontains=search)
        return queryset

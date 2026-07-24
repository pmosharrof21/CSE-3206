from django.db import models
from hotels.models import Hotel
class Room(models.Model):
    hotel = models.ForeignKey(Hotel, related_name='rooms', on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    room_type = models.CharField(max_length=50)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.PositiveIntegerField(default=2)
    available = models.BooleanField(default=True)
    image_url = models.URLField(blank=True)
    amenities = models.JSONField(default=list, blank=True)
    def __str__(self): return f'{self.hotel.name} - {self.name}'

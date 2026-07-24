from django.db import models
from rooms.models import Room
class Booking(models.Model):
    STATUS = [('pending', 'Pending'), ('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')]
    room = models.ForeignKey(Room, related_name='bookings', on_delete=models.PROTECT)
    guest_name = models.CharField(max_length=150)
    guest_email = models.EmailField()
    check_in = models.DateField()
    check_out = models.DateField()
    guests = models.PositiveIntegerField(default=1)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    status = models.CharField(max_length=12, choices=STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    def save(self, *args, **kwargs):
        if self.check_in and self.check_out and self.room_id:
            self.total_amount = (self.check_out - self.check_in).days * self.room.price_per_night
        super().save(*args, **kwargs)

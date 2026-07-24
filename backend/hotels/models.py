from django.db import models

class Hotel(models.Model):
    name = models.CharField(max_length=160)
    city = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    description = models.TextField()
    image_url = models.URLField(blank=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0)
    amenities = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-rating', 'name']
    def __str__(self): return self.name

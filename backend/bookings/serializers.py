from rest_framework.serializers import ModelSerializer, ValidationError
from .models import Booking
class BookingSerializer(ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('total_amount', 'status', 'created_at')
    def validate(self, data):
        if data['check_out'] <= data['check_in']: raise ValidationError('Check-out must be after check-in.')
        return data

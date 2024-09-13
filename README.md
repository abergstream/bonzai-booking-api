# Booking API

### Endpoints

Endpoints will be posted in the school platform

### Example params

##### POST

```
{
  "name": "Firstname Lastname",
  "email": "email@email.com",
  "from": "2024-09-15",
  "to": "2024-09-16",
  "guests": 1,
  "room_type": {
    "Enkelrum": 1,
    "Dubbelrum": 0,
    "Svit": 0
  }
}
```

##### PUT

```
{
  "from": "2024-10-20",
  "to": "2024-10-30",
  "guests": 3,
  "room_type": {
    "Enkelrum": 1,
    "Dubbelrum": 1,
    "Svit": 1
  }
}
```

# Changelog

## 1.4.0 - 2026-11-28

### Features
- Fuel: the price totem of the Carburants France card shows the cheapest price of every fuel followed, with the station, whether it is open, its distance and the directions.

## 1.3.2 - 2026-11-28

### Fixes
- After an update, the panel no longer shows English words ("Yesterday", "Recent trips"…) in another language: the language file is fetched with the version, so the browser never keeps an older one.

## 1.3.1 - 2026-11-28

### Fixes
- The sidebar's menu button shows in the header on a phone (narrow screen) and when the sidebar is hidden.

## 1.3.0 - 2026-11-28

### Features
- Settings: the vehicles' location can be for administrators only. The other users then don't see the place, the map or the directions to the cars in the panel.

## 1.2.0 - 2026-11-28

### Features
- The plate is drawn like the real one, as on the vehicle card: EU band, the department on the right band, and the traditional emblem of Brittany, Occitania, Île-de-France, Provence, Corsica and Burgundy.
- The plate comes from the device's name when it is a French registration; a plate typed in Settings gets its dashes.
- Settings: the department on the plate.

## 1.1.1 - 2026-11-28

### Fixes
- The fill-up cost, the cheapest station and the low range check use each car's own fuel (from Vehicle Consumption), no longer the first fuel followed.
- The best and target prices of SP95 no longer pick those of SP95-E10.
- An unlocked car is in the list of what to check with a lock sensor only, too (not while it is driving).
- The last 7 days show kWh/100 km for an electric car.
- A name with "$" from Home Assistant is shown as it is in the panel's texts.
- Maintenance items of a device show their short name next to it; card headers wrap on narrow screens.

## 1.1.0 - 2026-11-28

### Features
- Overview: each car's plate, chips (lock, place and last update, driving with a pulsing dot, outside temperature, doors, charging), the cost of a full tank and the data plan's renewal, and every button of the car; where the cars are, on Home Assistant's map, with directions; one list of what to check with its action (Done, Directions, Lock, Log); the last 7 days and the last trips.
- Every action is asked first in the panel.
- Consumption, with Vehicle Consumption: the month against the average, cost per km, CO₂, trips and next service; a 12-month chart of the consumption, distance, cost or CO₂; the recent trips; the refuels or charges, with Log a refuel.
- Trips: each car's recent trips under its 7-day bars.
- Fuel, with Carburants France: the stations of a fuel with their brand, opening hours, distance, 30-day price line, shortages and directions; the best price against the month; the target price; each car's fill-up and the nearest open station; charging for electric and plug-in cars and a home charger.
- Maintenance: the vehicle tasks with Done, the next service with Log, the tyre pressures around the car seen from above (no longer on the overview's tiles).
- Lease: only the cars with a contract, the tab hidden without one; the gap to the pace, kilometres left this month and per month to the end, the projection at the recent pace, the excess cost and the mileage against the contract.
- Settings: the plate, the price of an extra km and the home charger of each car.

## 1.0.0 - 2026-11-27

### Features
- A **Vehicles** panel in the sidebar, for every user, for connected cars of any brand: the integration registers it, and the panel finds each vehicle's entities from its device (18 car integrations, whatever the entity IDs or the language).
- An illustrated header with the cars parked by the road (their own photo when the integration gives one) and a status pill: all locked, unlocked, low range.
- Overview: a tile per car (picture, range, fuel or battery level, mileage, tyres, data plan, location, action buttons) and the consumption, lease, fuel and maintenance cards.
- Trips: kilometres driven today, this week and day by day over 7 days, from the mileage history.
- Consumption: the week's figures and an 8-week chart, with Vehicle Consumption.
- Fuel: the stations sorted by price and the cost of a full tank, with Carburants France.
- Maintenance: the Maintenance integration's tasks, overdue and due soon first, and the tyre pressures.
- Lease: kilometres driven against the contract, expected at this date, the end-of-contract projection and the monthly allowance left.
- Settings: name, lease contract, tank, picture and optional devices per car, and the low range alert (administrators only); the vehicles, stations and maintenance entities are picked in the integration's setup and options.
- 22 languages, light and dark themes.

import {createHash} from 'node:crypto'
import geoip from 'geoip-lite'
import rawCities from 'cities.json' with {type: 'json'}

type LatLng = [number, number]

type CityRecord = {
	name: string
	country: string
	lat: string
	lng: string
}

// Create a map of city records by name and country so we can lookup cities to get their lat/lng
const cityIndex = new Map<string, CityRecord>()

for (const city of rawCities as CityRecord[]) {
	cityIndex.set(`${city.name}|${city.country}`, city)
}

// 64-entry list of cities for fallback when geoip lookup fails or peer is tor/i2p/etc
// Weighted by Bitnodes June-2025 reachable nodes estimates: https://bitnodes.io/nodes/all/countries/
const fallbackCityKeys: string[] = [
	// United States (30% of peers = ~19)
	'New York City|US',
	'Chicago|US',
	'Los Angeles|US',
	'Seattle|US',
	'San Francisco|US',
	'Denver|US',
	'Dallas|US',
	'Miami|US',
	'Atlanta|US',
	'Boston|US',
	'Phoenix|US',
	'Houston|US',
	'Minneapolis|US',
	'Philadelphia|US',
	'Portland|US',
	'San Diego|US',
	'Las Vegas|US',
	'Kansas City|US',
	'Salt Lake City|US',

	// Germany (13% of peers = ~9)
	'Frankfurt am Main|DE',
	'Berlin|DE',
	'Düsseldorf|DE',
	'Hamburg|DE',
	'Munich|DE',
	'Nürnberg|DE',
	'Stuttgart|DE',
	'Köln|DE',
	'Leipzig|DE',

	// Canada (5% of peers = ~3)
	'Toronto|CA',
	'Montréal|CA',
	'Vancouver|CA',

	// France (4% of peers = ~3)
	'Paris|FR',
	'Lyon|FR',
	'Marseille|FR',

	// United Kingdom (4% of peers = ~3)
	'London|GB',
	'Manchester|GB',
	'Birmingham|GB',

	// Netherlands (3% of peers = ~2)
	'Amsterdam|NL',
	'Rotterdam|NL',
	'The Hague|NL',

	// China (2% of peers = ~1)
	'Beijing|CN',
	'Shanghai|CN',

	// Russia (2% of peers = ~1)
	'Moscow|RU',
	'Saint Petersburg|RU',

	// Australia (2% of peers = ~1)
	'Sydney|AU',
	'Melbourne|AU',

	// Brazil (2% of peers = ~1)
	'São Paulo|BR',
	'Rio de Janeiro|BR',

	// Switzerland (2% of peers = ~1)
	'Zürich|CH',
	'Genève|CH',

	// Single-bucket countries (1% of peers = ~1)
	'Madrid|ES',
	'Milan|IT',
	'Helsinki|FI',
	'Tokyo|JP',
	'Singapore|SG',
	'Seoul|KR',
	'Stockholm|SE',
	'Prague|CZ',
	'Vienna|AT',
	'Hong Kong|HK',
	'Lisbon|PT',
	'Brussels|BE',
	'Bangkok|TH',
	'Warsaw|PL',
]

const fallbackCityRecords: CityRecord[] = fallbackCityKeys.map((key) => {
	const city = cityIndex.get(key)
	if (!city) throw new Error(`Anchor ${key} missing in cities.json`)
	return city
})

// Returns a latitude and longitude for a given IP address and network
// If it is an ipv4 or ipv6 address, it will return the latitude and longitude of the city from the geoip database
// If it is a private IP address, or is not in the geoip database version installed, or it is a
// Tor, I2P, or other unroutable network then it will return a deterministic fake city from 64-entry curated list of cities
export function ipToLatLng(ip: string, network: string): LatLng {
	if (network === 'ipv4' || network === 'ipv6') {
		const geo = geoip.lookup(ip)
		if (geo?.ll) return [geo.ll[0], geo.ll[1]]
	}
	// deterministic fallback
	const idx = createHash('md5').update(ip).digest()[0] & 63 // 0-63
	const {lat, lng} = fallbackCityRecords[idx]
	return [Number(lat), Number(lng)]
}

// 64 evenly-spread cities accross the globe
// const anchorNames: string[] = [
//   // Europe & Arctic
//   'Frankfurt am Main|DE','Amsterdam|NL','Berlin|DE','London|GB',
//   'Paris|FR','Madrid|ES','Dublin|IE','Stockholm|SE',
//   'Helsinki|FI','Warsaw|PL','Prague|CZ','Vienna|AT',
//   'Zürich|CH','Milan|IT','Lisbon|PT','Reykjavík|IS',

//   // North & South America
//   'New York City|US','Chicago|US','Toronto|CA','Montréal|CA',
//   'Los Angeles|US','Seattle|US','San Francisco|US','Denver|US',
//   'Dallas|US','Miami|US','Atlanta|US','São Paulo|BR',
//   'Buenos Aires|AR','Santiago|CL','Mexico City|MX','Bogotá|CO',

//   // Asia-Pacific
//   'Tokyo|JP','Osaka|JP','Seoul|KR','Hong Kong|HK',
//   'Taipei|TW','Singapore|SG','Kuala Lumpur|MY','Bangkok|TH',
//   'Mumbai|IN','Bengaluru|IN','Istanbul|TR','Tel Aviv|IL',
//   'Dubai|AE','Johannesburg|ZA','Lagos|NG','Nairobi|KE',

//   // Oceania & remote
//   'Sydney|AU','Melbourne|AU','Perth|AU','Auckland|NZ',
//   'Honolulu|US','Anchorage|US','Nuuk|GL','Casablanca|MA',
//   'Windhoek|NA','Antananarivo|MG','Port Moresby|PG','Papeete|PF',
//   'Tarawa|KI','Suva|FJ','Ulan Bator|MN','Addis Ababa|ET'
// ];

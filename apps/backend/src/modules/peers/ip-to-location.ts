import {createHash} from 'node:crypto'
import geoip from 'geoip-lite'
import rawCities from 'cities.json' assert {type: 'json'}

const cities = rawCities as Array<{lat: number; lng: number}>

type LatLng = [number, number]

// Returns a latitude and longitude for a given IP address and network
// If it is an ipv4 or ipv6 address, it will return the latitude and longitude of the city from the geoip database
// If it is a private IP address, or is not in the geoip database version installed, or it is a
// Tor, I2P, or other unroutable network then it will return a deterministic fake city from the cities.json file
export function ipToLatLng(ip: string, network: string): LatLng {
	if (network === 'ipv4' || network === 'ipv6') {
		const geoRecord = geoip.lookup(ip)
		if (geoRecord?.ll) return [geoRecord.ll[0], geoRecord.ll[1]]
	}
	return fakeCityHash(ip)
}

// Fake location, deterministically derived from a peer’s address string and the cities.json file
// TODO: think about clustering issue. There are more cities in certain parts of the world than others,
// so it is more likely that peers will be clustered in certain parts of the world than others.
// This probably makes sense, but it may be in areas of the world that are super unlikely to be running nodes.
function fakeCityHash(seed: string): LatLng {
	const cityIndex = createHash('md5').update(seed).digest()[0] % cities.length
	const {lat, lng} = cities[cityIndex] as {lat: number; lng: number}
	return [lat, lng]
}

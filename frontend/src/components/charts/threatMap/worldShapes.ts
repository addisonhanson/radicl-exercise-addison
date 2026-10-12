import { geoNaturalEarth1, geoPath } from 'd3-geo'
import type { FeatureCollection, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'

// Country outlines projected once at module load into SVG path strings for
// a fixed MAP_WIDTH x MAP_HEIGHT viewBox; the SVG scales to fit its box.
export const MAP_WIDTH = 960
export const MAP_HEIGHT = 440

type CountryProperties = { name: string }

export type CountryShape = {
  // ISO 3166-1 numeric code, e.g. "643"
  id: string
  name: string
  d: string
}

const ANTARCTICA = '010'

const topology = world as unknown as Topology<{ countries: GeometryCollection<CountryProperties> }>
const collection = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, CountryProperties>

// Antarctica is dropped: it has no attack sources and takes a lot of height.
const features = collection.features.filter((country) => country.id !== ANTARCTICA)

const projection = geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], { type: 'FeatureCollection', features })
const toPath = geoPath(projection)

export const countryShapes: CountryShape[] = features.map((country) => ({
  id: String(country.id),
  name: country.properties.name,
  d: toPath(country) ?? '',
}))

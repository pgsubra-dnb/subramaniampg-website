import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'vpwi5zan',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

const result = await client.fetch(`*[_type == 'course'] | order(price asc) {
  _id, title,
  "avgRating": math::avg(*[_type == 'feedbackRecord' && courseRef._ref == ^._id].starRating),
  "ratingCount": count(*[_type == 'feedbackRecord' && courseRef._ref == ^._id])
}`)

console.log(JSON.stringify(result, null, 2))

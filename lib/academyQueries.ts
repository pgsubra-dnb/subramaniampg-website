import { sanityClient } from './academy'

export async function getAllCourses() {
  return sanityClient.fetch(`
    *[_type == 'course'] | order(price asc) {
      _id, title, slug, shortDescription, price, status,
      discountActive, discountPercent, discountReason, discountExpiry,
      coverImage { asset -> { url } },
      badgeImage { asset -> { url } },
      "moduleCount": count(modules),
      "avgRating": math::avg(*[_type == 'feedbackRecord' && courseRef._ref == ^._id].starRating),
      "ratingCount": count(*[_type == 'feedbackRecord' && courseRef._ref == ^._id])
    }
  `, {}, { cache: 'no-store' })
}

export async function getCourseBySlug(slug: string) {
  return sanityClient.fetch(`
    *[_type == 'course' && slug.current == $slug][0] {
      _id, title, slug, shortDescription, descriptionLine, tagline,
      price, status, hasAssignments,
      coverImage { asset -> { url } },
      badgeImage { asset -> { url } },
      paidConsultation {
        enabled, title, description, price, durationMinutes,
        bookingLink -> { url }
      },
      modules[] -> {
        _id, title, order, badgeName,
        badgeImage { asset -> { url } },
        questionsToShow,
        "hasAssignments": count(assignmentBank) > 0,
        lessons[] -> {
          _id, title, order, pointsValue, interactiveType
        }
      }
    }
  `, { slug })
}

export async function getModuleAssignmentBank(moduleId: string) {
  return sanityClient.fetch(`
    *[_type == 'academyModule' && _id == $moduleId][0] {
      _id,
      assignmentBank[] -> { _id, title, prompt, allowText, allowFile, acceptedFileTypes }
    }
  `, { moduleId })
}

export async function getLesson(lessonId: string) {
  return sanityClient.fetch(`
    *[_type == 'lesson' && _id == $lessonId][0] {
      _id, title, order, body, pointsValue,
      interactiveType, interactiveContent,
      moduleRef -> { _id, title, order, courseRef -> { slug } }
    }
  `, { lessonId }, { cache: 'no-store' })
}

export async function getModuleWithQuiz(moduleId: string) {
  return sanityClient.fetch(`
    *[_type == 'academyModule' && _id == $moduleId][0] {
      _id, title, order, badgeName, questionsToShow,
      badgeImage { asset -> { url } },
      quizQuestionBank[] {
        _key, questionText, optionA, optionB, optionC, optionD,
        correctAnswer, explanation, points
      },
      courseRef -> { _id, title, slug }
    }
  `, { moduleId })
}

export async function getPublishedFeedback(courseId: string) {
  return sanityClient.fetch(`
    *[_type == 'feedbackRecord' && courseRef._ref == $courseId && published == true] {
      starRating, mostUseful
    }
  `, { courseId })
}

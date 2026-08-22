module ApplicationHelper
  def page_title(title)
    content_for(:title, title)
  end

  def hope_by_label(request)
    return "No date" if request.hope_by.blank?

    request.hope_by.to_fs(:long)
  end
end


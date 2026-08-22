class PrayerMarksController < ApplicationController
  before_action :set_prayer_request

  def create
    unless @prayer_request.status_open?
      redirect_to @prayer_request
      return
    end

    @prayer_request.prayer_marks.create_or_find_by!(user: Current.user)
    redirect_to @prayer_request
  end

  def destroy
    @prayer_request.prayer_marks.find_by(user: Current.user)&.destroy!
    redirect_to @prayer_request, status: :see_other
  end
end

class PrayerRequestsController < ApplicationController
  before_action :set_prayer_request, only: %i[ show edit update destroy ]

  def index
    @prayer_requests = Current.user.accessible_requests.open_list
  end

  def answered
    @prayer_requests = Current.user.accessible_requests.answered_list
  end

  def show
    @request_updates = @prayer_request.request_updates.chronologically.includes(:author)
    @prayer_notes = @prayer_request.prayer_notes.chronologically.includes(:author)
    @prayer_mark = @prayer_request.prayer_marks.find_by(user: Current.user)
    @request_update = RequestUpdate.new
    @prayer_note = PrayerNote.new
  end

  def new
    @prayer_request = PrayerRequest.new(visibility: :circle)
  end

  def create
    @prayer_request = current_circle.prayer_requests.new(prayer_request_params)
    @prayer_request.author = Current.user

    if @prayer_request.save
      @prayer_request.notify_new_request
      redirect_to @prayer_request, notice: "Request logged."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    unless @prayer_request.author_id == Current.user.id
      head :forbidden
    end
  end

  def update
    unless @prayer_request.author_id == Current.user.id
      head :forbidden
      return
    end

    was_private = @prayer_request.visibility_private?
    if @prayer_request.update(prayer_request_params)
      @prayer_request.notify_new_request if was_private && @prayer_request.visibility_circle?
      redirect_to @prayer_request, notice: "Request updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    unless @prayer_request.author_id == Current.user.id
      head :forbidden
      return
    end

    @prayer_request.destroy!
    redirect_to root_path, notice: "Request removed.", status: :see_other
  end

  private
    def prayer_request_params
      params.expect(prayer_request: [ :title, :body, :who_for, :category, :category_other, :hope_by, :visibility ])
    end
end

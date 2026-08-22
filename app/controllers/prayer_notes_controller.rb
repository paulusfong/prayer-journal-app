class PrayerNotesController < ApplicationController
  before_action :set_prayer_request
  before_action :set_prayer_note, only: %i[ update destroy ]

  def create
    unless @prayer_request.status_open?
      redirect_to @prayer_request
      return
    end

    @prayer_note = @prayer_request.prayer_notes.new(note_params)
    @prayer_note.author = Current.user
    if @prayer_note.save
      redirect_to @prayer_request, notice: "Note added."
    else
      redirect_to @prayer_request, alert: @prayer_note.errors.full_messages.to_sentence
    end
  end

  def update
    unless @prayer_note.author_id == Current.user.id && @prayer_request.status_open?
      head :forbidden
      return
    end

    if @prayer_note.update(note_params)
      redirect_to @prayer_request, notice: "Note updated."
    else
      redirect_to @prayer_request, alert: @prayer_note.errors.full_messages.to_sentence
    end
  end

  def destroy
    unless @prayer_note.author_id == Current.user.id
      head :forbidden
      return
    end

    @prayer_note.destroy!
    redirect_to @prayer_request, notice: "Note removed.", status: :see_other
  end

  private
    def set_prayer_note
      @prayer_note = @prayer_request.prayer_notes.find(params[:id])
    end

    def note_params
      params.expect(prayer_note: [ :body ])
    end
end

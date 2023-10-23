# DROP  VIEW mis_reports;

CREATE VIEW mis_reports AS 
SELECT rcmr.uuid, rcmr.instrument_text, rcmr.instrument_size_number,rcmr.category_text , rcmr.sub_category_text,
          c.name AS company_name, rcmr.voting_status, rcmr.agenda AS agenda_type, rcmr.long_term_rating_recommendation,
          rcmr.short_term_rating_recommendation, rcmr.short_term_outlook_recommendation,
          rcmr.long_term_outlook_recommendation, rcmr.long_term_outlook AS current_outlook, rcmr.long_term_rating_assgined_text  AS current_rating,rcmr.previous_rating,
          rcmr.previous_outlook, rct.name AS committee_type,
           rcmc.name AS category, m.mandate_id AS mandate_id,ti.complexity_level, c.uuid AS company_uuid,rcm.meeting_type AS meeting_type, rcm.meeting_at AS meeting_date, rcm.id AS meeting_id,
           id.press_release_date,
           id.rating_acceptance_date,id.rating_acceptance_status,
           id.rating_letter_date,mei.name AS macro_economic_indicator,s.name AS sector, i.name AS industry, si.name AS sub_industry from companies c 
          INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.company_id = c.id
          INNER JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id
          INNER JOIN mandates m ON m.id = rcmr.mandate_id
          INNER JOIN rating_committee_types rct ON rct.id = rcmr.rating_committee_type_id 
          INNER JOIN rating_committee_meeting_categories rcmc ON rcmc.id = rcmr.rating_committee_meeting_category_id 
          INNER JOIN instrument_details id ON id.id = rcmr.instrument_detail_id 
          INNER JOIN transaction_instruments ti ON ti.id = rcmr.transaction_instrument_id
          INNER JOIN macro_economic_indicators mei ON mei.id = c.macro_economic_indicator_id 
          INNER JOIN sectors s ON s.id = c.sector_id
          INNER JOIN industries i ON i.id = c.industry_id
          INNER JOIN sub_industries si ON si.id = c.sub_industry_id
          WHERE rcmr.overall_status = 'Rating Verified'
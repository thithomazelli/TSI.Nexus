using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utitlities;

namespace TSI.Friday.Services
{
    public sealed class IndividualService : IIndividualService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Individual registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Individual> _repository;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// IndividualService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Individual> object used to initialize the internal variable using Dependency Injection.</param>
        public IndividualService(IRepository<Individual> repository)
        {
            _repository = repository;
        }

        /// <inheritdoc />
        public WebApiResponse<Individual> Add(Individual individual)
        {
            WebApiResponse<Individual> result = new();

            try
            {
                var individualDuplicatedMessage = CheckIfIndividualIsDuplicatedAndGetErrorMessage(individual);

                if (!string.IsNullOrEmpty(individualDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = individualDuplicatedMessage;
                    return result;
                }

                _repository.Add(individual);

                result.Data = individual;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {individual.Name} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível cadastrar o Cliente {individual.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Individual> Update(Individual individual)
        {
            WebApiResponse<Individual> result = new();

            try
            {
                var IndividualDuplicatedMessage = CheckIfIndividualIsDuplicatedAndGetErrorMessage(individual);

                if (!string.IsNullOrEmpty(IndividualDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = IndividualDuplicatedMessage;
                    return result;
                }

                _repository.Update(individual);

                result.Data = individual;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {individual.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível atualizar os dados do Cliente {individual.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Individual> Remove(Individual individual)
        {
            WebApiResponse<Individual> result = new();

            try
            {
                _repository.Remove(individual);

                result.Data = individual;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {individual.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível remover o Cliente {individual.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<IEnumerable<Individual>> FindAll()
        {
            WebApiResponse<IEnumerable<Individual>> result = new();

            try
            {
                result.Data = _repository.GetAll();
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Individual> FindById(int? id)
        {
            WebApiResponse<Individual> result = new();

            try
            {
                result.Data = _repository.GetById(id);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso"
                    : $"Nenhum Cliente com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<IEnumerable<Individual>> FindByEmail(string email)
        {
            WebApiResponse<IEnumerable<Individual>> result = new();

            try
            {
                result.Data = _repository.Query(_ => _.Email.Contains(email));
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Individual> FindBySocialSecurityCard(string socialSecurityCard)
        {
            WebApiResponse<Individual> result = new();

            try
            {
                result.Data = _repository.Query(_ => _.SocialSecurityCard.Equals(socialSecurityCard))?.FirstOrDefault();
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso."
                    : $"Nenhum Cliente com o CPF {socialSecurityCard} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Should verify if the Individual is already being registered on the database.
        /// </summary>
        /// <param name="Individual">The Individual object that is being added or updated.</param>
        /// <returns>The error message when Individual is duplicated. Otherwise an empty string.</returns>
        private string CheckIfIndividualIsDuplicatedAndGetErrorMessage(Individual Individual)
        {
            if (IsNameDuplicated(Individual))
            {
                return $"Já existe um Cliente cadastrado com Nome {Individual.Name}.";
            }

            if (IsEmailDuplicated(Individual))
            {
                return $"Já existe um Cliente cadastrado com E-mail {Individual.Email}.";
            }

            if (IsSocialSecurityCardDuplicated(Individual))
            {
                return $"Já existe um Cliente cadastrado com o CPF {Individual.SocialSecurityCard}.";
            }

            if (IsNationalIDCardDuplicated(Individual))
            {
                return $"Já existe um Cliente cadastrado com o RG {Individual.NationalIdCard}.";
            }

            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Individual email is already being used by another register on the database.
        /// </summary>
        /// <param name="Individual">The Individual object that is being added or updated.</param>
        /// <returns>True when the Email is duplicated; Otherwise false.</returns>
        private bool IsEmailDuplicated(Individual Individual)
        {
            return _repository
                .Query(_ => _.Id != Individual.Id && !string.IsNullOrEmpty(_.Email) && _.Email == Individual.Email)
                .Any();
        }

        /// <summary>
        /// Should verify if the Individual name is already being used by another register on the database.
        /// </summary>
        /// <param name="Individual">The Individual object that is being added or updated.</param>
        /// <returns>True when the Name is duplicated; Otherwise false.</returns>
        private bool IsNameDuplicated(Individual Individual)
        {
            return _repository
                .Query(_ => _.Id != Individual.Id && _.Name == Individual.Name)
                .Any();
        }

        /// <summary>
        /// Should verify if the Individual NationalIDCard is already being used by another register on the database.
        /// </summary>
        /// <param name="Individual">The Individual object that is being added or updated.</param>
        /// <returns>True when the NationalIDCard is duplicated; Otherwise false.</returns>
        private bool IsNationalIDCardDuplicated(Individual Individual)
        {
            return _repository
                .Query(_ => _.Id != Individual.Id && !string.IsNullOrEmpty(_.NationalIdCard) &&
                            _.NationalIdCard == Individual.NationalIdCard)
                .Any();
        }

        /// <summary>
        /// Should verify if the Individual SocialSecurityCard is already being used by another register on the database.
        /// </summary>
        /// <param name="Individual">The Individual object that is being added or updated.</param>
        /// <returns>True when the SocialSecurityCard is duplicated; Otherwise false.</returns>
        private bool IsSocialSecurityCardDuplicated(Individual Individual)
        {
            return _repository
                .Query(_ => _.Id != Individual.Id && !string.IsNullOrEmpty(_.SocialSecurityCard) &&
                            _.SocialSecurityCard == Individual.SocialSecurityCard)
                .Any();
        }

        #endregion Private methods
    }
}
